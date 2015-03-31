#Thanks to https://docs.python.org/3.4/library/xml.etree.elementtree.html

class ParseXML:
	def __init__(self, xmlFile):
		self.xmlFile = xmlFile

	def xmlToHTML(self):
		import xml.etree.ElementTree as xmlParser
		xml = xmlParser.parse(self.xmlFile)
		self.root = xml.getroot()
		print(self.root.tag, self.root.attrib)
		for child in self.root:
			print(child.tag, child.attrib)
			for grandchild in child:
				print(grandchild.tag, grandchild.attrib)
			print("----------------\n\n")